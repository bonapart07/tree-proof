// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GreenProofTreeAudit
 * @dev Transparent cryptographic audit ledger for verified tree plantations,
 * survival milestones, and GreenPoints reward allocations.
 * Note: Personal data is NEVER stored on-chain; only hashes and environmental metrics.
 */
contract GreenProofTreeAudit {
    address public immutable owner;

    struct TreeAuditRecord {
        string treeId; // e.g. TREE-AS-000001
        bytes32 metadataHash; // SHA-256 hash of photo, species, GNSS & AI metrics
        string species;
        int256 latitude; // scaled by 1e6
        int256 longitude; // scaled by 1e6
        address planter;
        uint256 plantedTimestamp;
        bool isVerified;
    }

    struct SurvivalRecord {
        uint256 milestoneDay; // 30, 90, 180, 365
        uint256 healthScore; // 0 - 100
        bytes32 photoAuditHash;
        uint256 verifiedTimestamp;
    }

    // Mappings
    mapping(string => TreeAuditRecord) public trees;
    mapping(string => SurvivalRecord[]) public survivalHistory;
    mapping(address => uint256) public userGreenPoints;

    // Events
    event TreeVerified(string indexed treeId, bytes32 metadataHash, address indexed planter, uint256 timestamp);
    event SurvivalVerified(string indexed treeId, uint256 milestoneDay, uint256 healthScore, bytes32 photoAuditHash);
    event RewardIssued(address indexed recipient, uint256 amountPoints, string milestone);
    event RewardRedeemed(address indexed user, uint256 pointsBurned, string rewardType);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only authorized oracle/admin can execute");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Records an initial verified tree plantation on the blockchain.
     */
    function recordVerifiedTree(
        string calldata treeId,
        bytes32 metadataHash,
        string calldata species,
        int256 lat,
        int256 lng,
        address planter
    ) external onlyOwner {
        require(!trees[treeId].isVerified, "Tree already recorded");

        trees[treeId] = TreeAuditRecord({
            treeId: treeId,
            metadataHash: metadataHash,
            species: species,
            latitude: lat,
            longitude: lng,
            planter: planter,
            plantedTimestamp: block.timestamp,
            isVerified: true
        });

        emit TreeVerified(treeId, metadataHash, planter, block.timestamp);
    }

    /**
     * @notice Issues GreenPoints loyalty tokens to planter for verified survival.
     */
    function issueReward(
        address recipient,
        uint256 greenPoints,
        string calldata milestone
    ) external onlyOwner {
        userGreenPoints[recipient] += greenPoints;
        emit RewardIssued(recipient, greenPoints, milestone);
    }

    /**
     * @notice Records survival milestone verification (30d, 90d, 180d, 365d).
     */
    function recordSurvivalVerification(
        string calldata treeId,
        uint256 milestoneDay,
        uint256 healthScore,
        bytes32 photoAuditHash
    ) external onlyOwner {
        require(trees[treeId].isVerified, "Tree not found");

        survivalHistory[treeId].push(SurvivalRecord({
            milestoneDay: milestoneDay,
            healthScore: healthScore,
            photoAuditHash: photoAuditHash,
            verifiedTimestamp: block.timestamp
        }));

        emit SurvivalVerified(treeId, milestoneDay, healthScore, photoAuditHash);
    }

    /**
     * @notice Records redemption of GreenPoints for eco-products, cash, or saplings.
     */
    function recordRedemption(
        address user,
        uint256 pointsBurned,
        string calldata rewardType
    ) external onlyOwner {
        require(userGreenPoints[user] >= pointsBurned, "Insufficient points");
        userGreenPoints[user] -= pointsBurned;

        emit RewardRedeemed(user, pointsBurned, rewardType);
    }

    /**
     * @notice Fetches count of survival verification milestones for a tree.
     */
    function getSurvivalCheckCount(string calldata treeId) external view returns (uint256) {
        return survivalHistory[treeId].length;
    }
}
